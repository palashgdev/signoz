import { Input } from 'antd';
import styled from 'styled-components';

const { Search } = Input;

export const Container = styled.div`
	display: flex;
	position: relative;
`;

export const SearchComponent = styled(Search)`
	.ant-btn-primary {
		svg {
			transform: scale(1.5);
		}
	}
`;
